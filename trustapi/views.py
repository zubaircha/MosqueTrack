from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Sum
from django.views.decorators.csrf import csrf_exempt
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

from .models import *
from .serializers import *
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

User = get_user_model()

def home_view(request):
    return HttpResponse("✅ MosqueTrack Backend is Live!")

# ✅ CSRF exempt for JWT + POST
@csrf_exempt
@api_view(['POST'])
def register_user(request):
    print("📥 REGISTER request:", request.data)
    username = request.data.get('username')
    password = request.data.get('password')
    confirm_password = request.data.get('confirm_password')
    mobile_number = request.data.get('mobile_number')

    if password != confirm_password:
        return Response({'error': 'Passwords do not match'}, status=400)

    if CustomUser.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=400)

    user = CustomUser(username=username, mobile_number=mobile_number, is_active=True)
    user.set_password(password)
    user.save()

    return Response({'message': 'User registered. Pending admin approval.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    user = request.user
    return Response({
        "username": user.username,
        "mobile_number": user.mobile_number,
        "is_approved": user.is_approved,
        "is_staff": user.is_staff,
    })

# ✅ CSRF exempt for login
@csrf_exempt
@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({'error': 'Invalid credentials'}, status=401)

    if not user.is_approved:
        return Response({'error': 'User not approved'}, status=403)

    refresh = RefreshToken.for_user(user)
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'username': user.username,
        'is_staff': user.is_staff,
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def pending_users(request):
    users = CustomUser.objects.filter(is_approved=False)
    serializer = UserApprovalSerializer(users, many=True)
    return Response(serializer.data)

# ✅ CSRF exempt
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_user(request, user_id):
    try:
        user = CustomUser.objects.get(id=user_id)
        user.is_approved = True
        user.save()
        return Response({'message': 'User approved.'})
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

# ✅ CSRF exempt
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAdminUser])
def decline_user(request, user_id):
    try:
        user = User.objects.get(id=user_id, is_approved=False)
        user.delete()
        return Response({"message": "User declined and deleted."})
    except User.DoesNotExist:
        return Response({"error": "User not found or already approved."}, status=status.HTTP_404_NOT_FOUND)

# ✅ CSRF exempt
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAdminUser])
def add_fund(request):
    serializer = FundCollectionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

# ✅ CSRF exempt
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAdminUser])
def add_expense(request):
    serializer = ExpenseSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

# ✅ CSRF exempt
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAdminUser])
def add_pay(request):
    serializer = PaySerializer(data=request.data)
    print("📥 Received in backend:", request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_pay_summary(request):
    month = request.GET.get('month')
    try:
        month_start = datetime.strptime(month + "-01", "%Y-%m-%d").date()
        next_month = month_start.replace(day=28) + timedelta(days=4)
        month_end = next_month.replace(day=1)
    except:
        return Response({"error": "Invalid month format. Use YYYY-MM."}, status=400)

    pays = Pay.objects.filter(month__gte=month_start, month__lt=month_end)
    total = pays.aggregate(Sum('amount'))['amount__sum'] or 0
    serialized = PaySerializer(pays, many=True)
    return Response({"month": month, "total_pay": total, "records": serialized.data})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_names(request):
    q = request.GET.get('q', '')
    names = Pay.objects.filter(name__icontains=q).values_list('name', flat=True).distinct()[:10]
    return Response(names)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def pay_status_summary(request):
    month = request.GET.get('month')
    if not month:
        return Response({"error": "Missing 'month' parameter."}, status=400)

    try:
        month_start = datetime.strptime(month + "-01", "%Y-%m-%d").date()
        next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    except ValueError:
        return Response({"error": "Invalid month format. Use YYYY-MM."}, status=400)

    all_persons = Person.objects.all()
    paid_person_ids = Pay.objects.filter(month__gte=month_start, month__lt=next_month).values_list('person_id', flat=True)
    unpaid_persons = all_persons.exclude(id__in=paid_person_ids)

    result = [{"person": person.name, "status": "Not Paid"} for person in unpaid_persons]

    return Response({
        "month": month,
        "unpaid_count": len(result),
        "unpaid": result
    })

@api_view(['GET'])
@permission_classes([IsAdminUser])
def unpaid_persons_summary(request):
    month = request.GET.get('month')
    if not month:
        return Response({"error": "Missing 'month' parameter."}, status=400)

    try:
        month_start = datetime.strptime(month + "-01", "%Y-%m-%d").date()
        next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    except ValueError:
        return Response({"error": "Invalid month format. Use YYYY-MM."}, status=400)

    paid_person_ids = Pay.objects.filter(month__gte=month_start, month__lt=next_month).values_list('person_id', flat=True).distinct()
    unpaid_persons = Person.objects.exclude(id__in=paid_person_ids)

    result = [{"id": person.id, "name": person.name, "status": "Not Paid"} for person in unpaid_persons]

    return Response({
        "month": month,
        "unpaid_count": len(result),
        "unpaid": result
    })

# ✅ CSRF exempt
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_person(request):
    serializer = PersonSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def person_list(request):
    persons = Person.objects.all().values('id', 'name')
    return Response(persons)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def summary(request):
    if not request.user.is_approved:
        return Response({"detail": "Not approved."}, status=403)

    from_date = request.GET.get('from')
    to_date = request.GET.get('to')

    try:
        from_date = datetime.strptime(from_date, "%Y-%m-%d").date()
        to_date = datetime.strptime(to_date, "%Y-%m-%d").date()
    except:
        return Response({"error": "Invalid date format."}, status=400)

    credits = FundCollection.objects.filter(date__range=(from_date, to_date)).values('date', 'name', 'description', 'amount')
    debits = Expense.objects.filter(date__range=(from_date, to_date)).values('date', 'description', 'amount')

    transactions = []
    for c in credits:
        transactions.append({
            "date": c['date'],
            "type": "Credit",
            "name": c['name'],
            "description": c['description'],
            "amount": float(c['amount']),
        })
    for d in debits:
        transactions.append({
            "date": d['date'],
            "type": "Debit",
            "name": "",
            "description": d['description'],
            "amount": -float(d['amount']),
        })

    transactions.sort(key=lambda x: x['date'])
    balance = 0
    for t in transactions:
        balance += t['amount']
        t['balance'] = balance

    return Response(transactions)

# (PDF report views remain unchanged — already using GET)

