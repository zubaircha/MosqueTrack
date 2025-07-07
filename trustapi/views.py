from django.contrib.auth import get_user_model

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from .models import *
from .serializers import *
from datetime import datetime
from django.utils import timezone
from django.db.models import Sum
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser
from .serializers import UserApprovalSerializer
from django.http import JsonResponse



User = get_user_model()

# Force redeploy


def home_view(request):
    return HttpResponse("✅ MosqueTrack Backend is Live!")

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
    user.set_password(password)  # ✅ this hashes the password
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
        "is_staff": user.is_staff,   # ✅ Add this line
    })
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

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
    print("USERNAME:", username)
    print("PASSWORD:", password)
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'username': user.username,
        'is_staff': user.is_staff,
    })

# views.py



@api_view(['GET'])
@permission_classes([IsAdminUser])
def pending_users(request):
    users = CustomUser.objects.filter(is_approved=False)
    serializer = UserApprovalSerializer(users, many=True)
    return Response(serializer.data)

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


@api_view(['POST'])
@permission_classes([IsAdminUser])
def add_fund(request):
    serializer = FundCollectionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def add_expense(request):
    serializer = ExpenseSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

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

@api_view(['POST'])
@permission_classes([IsAdminUser])
def add_pay(request):  
    
    serializer = PaySerializer(data=request.data)   
    print("📥 Received in backend:", request.data)  # Add this line

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
        next_month = month_start.replace(day=28) + timezone.timedelta(days=4)
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

from reportlab.lib import colors

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response




@api_view(['POST'])
@permission_classes([IsAdminUser])
def decline_user(request, user_id):
    try:
        user = User.objects.get(id=user_id, is_approved=False)
        user.delete()  # or you can set a field like user.is_active = False
        return Response({"message": "User declined and deleted."})
    except User.DoesNotExist:
        return Response({"error": "User not found or already approved."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pay_pdf_report(request):
    month = request.GET.get('month')
    try:
        month_start = datetime.strptime(month + "-01", "%Y-%m-%d").date()
        next_month = month_start.replace(day=28) + timezone.timedelta(days=4)
        month_end = next_month.replace(day=1)
    except:
        return Response({"error": "Invalid month format. Use YYYY-MM."}, status=400)

    all_persons = Person.objects.all()
    pays = Pay.objects.filter(month__gte=month_start, month__lt=month_end)
    pay_map = {pay.person.id: pay for pay in pays}

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Pay_Report_{month}.pdf"'

    p = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    y = height - 50

    p.setFont("Helvetica-Bold", 14)
    p.drawString(200, y, f"Pay Report - {month}")
    y -= 40

    p.setFont("Helvetica-Bold", 11)
    p.drawString(50, y, "Name")
    p.drawString(200, y, "Amount")
    p.drawString(300, y, "Description")
    y -= 20

    p.setFont("Helvetica", 10)
    total = 0
    for person in all_persons:
        pay = pay_map.get(person.id)
        amount = f"{pay.amount:.2f}" if pay else ""
        description = pay.description if pay else ""
        p.drawString(50, y, person.name)
        p.drawString(200, y, amount)
        p.drawString(300, y, description)
        if pay:
            total += pay.amount
        y -= 20
        if y < 50:
            p.showPage()
            y = height - 50

    y -= 20
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, f"Total Paid: Rs {total:.2f}")

    p.showPage()
    p.save()
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def person_list(request):
    persons = Person.objects.all().values('id', 'name')
    return Response(persons)

from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from .models import Person, Pay

@api_view(['GET'])
@permission_classes([IsAdminUser])  # Optional: remove if not needed
def pay_status_summary(request):
    month = request.GET.get('month')  # format: YYYY-MM
    if not month:
        return Response({"error": "Missing 'month' parameter."}, status=400)

    try:
        # Define start and end of the month
        month_start = datetime.strptime(month + "-01", "%Y-%m-%d").date()
        next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    except ValueError:
        return Response({"error": "Invalid month format. Use YYYY-MM."}, status=400)

    # Get all persons and pay records
    all_persons = Person.objects.all()
    paid_person_ids = Pay.objects.filter(month__gte=month_start, month__lt=next_month).values_list('person_id', flat=True)

    # Filter only persons who have NOT paid
    unpaid_persons = all_persons.exclude(id__in=paid_person_ids)

    # Build result
    result = []
    for person in unpaid_persons:
        result.append({
            "person": person.name,
            "status": "Not Paid"
        })

    return Response({
        "month": month,
        "unpaid_count": len(result),
        "unpaid": result
    })
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from .models import Person, Pay

@api_view(['GET'])
@permission_classes([IsAdminUser])
def unpaid_persons_summary(request):
    month = request.GET.get('month')  # e.g. '2025-06'
    if not month:
        return Response({"error": "Missing 'month' parameter."}, status=400)

    try:
        month_start = datetime.strptime(month + "-01", "%Y-%m-%d").date()
        next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    except ValueError:
        return Response({"error": "Invalid month format. Use YYYY-MM."}, status=400)

    # All pay records in that month
    paid_person_ids = Pay.objects.filter(
        month__gte=month_start,
        month__lt=next_month
    ).values_list('person_id', flat=True).distinct()

    # Get persons who have NOT paid anything
    unpaid_persons = Person.objects.exclude(id__in=paid_person_ids)

    # Build response
    result = []
    for person in unpaid_persons:
        result.append({
            "id": person.id,
            "name": person.name,
            "status": "Not Paid"
        })

    return Response({
        "month": month,
        "unpaid_count": len(result),
        "unpaid": result
    })


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
def funds_expenses_pdf_report(request):
    if not request.user.is_approved:
        return Response({"detail": "User not approved."}, status=403)

    from_date = request.GET.get('from')
    to_date = request.GET.get('to')

    try:
        from_date = datetime.strptime(from_date, "%Y-%m-%d").date()
        to_date = datetime.strptime(to_date, "%Y-%m-%d").date()
    except:
        return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

    credits = FundCollection.objects.filter(date__range=(from_date, to_date)).values(
        'date', 'name', 'description', 'amount'
    )
    debits = Expense.objects.filter(date__range=(from_date, to_date)).values(
        'date', 'description', 'amount'
    )

    # Combine data
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

    # Generate PDF
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Fund_Statement_{from_date}_to_{to_date}.pdf"'

    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4

    p = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    y = height - 50

    p.setFont("Helvetica-Bold", 14)
    p.drawString(180, y, "Fund & Expense Statement")
    y -= 20
    p.setFont("Helvetica", 12)
    p.drawString(180, y, f"{from_date} to {to_date}")
    y -= 30

    p.setFont("Helvetica-Bold", 10)
    p.drawString(30, y, "Date")
    p.drawString(90, y, "Type")
    p.drawString(150, y, "Name")
    p.drawString(250, y, "Description")
    p.drawString(420, y, "Amount")
    p.drawString(480, y, "Balance")
    y -= 15
    p.line(30, y, 550, y)
    y -= 15

    p.setFont("Helvetica", 9)
    for t in transactions:
        p.drawString(30, y, str(t['date']))
        p.drawString(90, y, t['type'])
        p.drawString(150, y, t['name'][:15])
        p.drawString(250, y, t['description'][:25])
        p.drawString(420, y, f"{t['amount']:.2f}")
        p.drawString(480, y, f"{t['balance']:.2f}")
        y -= 15
        if y < 50:
            p.showPage()
            y = height - 50

    p.showPage()
    p.save()
    return response



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def donation_pdf_report(request):
    if not request.user.is_approved:
        return Response({"detail": "User not approved."}, status=403)

    from_date = request.GET.get('from')
    to_date = request.GET.get('to')

    try:
        from_date = datetime.strptime(from_date, "%Y-%m-%d").date()
        to_date = datetime.strptime(to_date, "%Y-%m-%d").date()
    except:
        return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

    donations = FundCollection.objects.filter(date__range=(from_date, to_date))

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Donations_{from_date}_to_{to_date}.pdf"'

    p = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    y = height - 50

    p.setFont("Helvetica-Bold", 14)
    p.drawString(200, y, "Donation Report")
    y -= 20
    p.setFont("Helvetica", 12)
    p.drawString(180, y, f"{from_date} to {to_date}")
    y -= 30

    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, y, "Date")
    p.drawString(150, y, "Name")
    p.drawString(300, y, "Description")
    p.drawString(470, y, "Amount")
    y -= 15
    p.line(50, y, 550, y)
    y -= 15

    total = 0
    p.setFont("Helvetica", 9)
    for d in donations:
        p.drawString(50, y, str(d.date))
        p.drawString(150, y, d.name[:20])
        p.drawString(300, y, d.description[:25])
        p.drawString(470, y, f"{d.amount:.2f}")
        total += d.amount
        y -= 15
        if y < 50:
            p.showPage()
            y = height - 50

    y -= 20
    p.setFont("Helvetica-Bold", 11)
    p.drawString(50, y, f"Total Donations: Rs {total:.2f}")

    p.showPage()
    p.save()
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expense_pdf_report(request):
    if not request.user.is_approved:
        return Response({"detail": "User not approved."}, status=403)

    from_date = request.GET.get('from')
    to_date = request.GET.get('to')

    try:
        from_date = datetime.strptime(from_date, "%Y-%m-%d").date()
        to_date = datetime.strptime(to_date, "%Y-%m-%d").date()
    except:
        return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

    expenses = Expense.objects.filter(date__range=(from_date, to_date))

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Expenses_{from_date}_to_{to_date}.pdf"'

    p = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    y = height - 50

    p.setFont("Helvetica-Bold", 14)
    p.drawString(200, y, "Expense Report")
    y -= 20
    p.setFont("Helvetica", 12)
    p.drawString(180, y, f"{from_date} to {to_date}")
    y -= 30

    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, y, "Date")
    p.drawString(250, y, "Description")
    p.drawString(470, y, "Amount")
    y -= 15
    p.line(50, y, 550, y)
    y -= 15

    total = 0
    p.setFont("Helvetica", 9)
    for e in expenses:
        p.drawString(50, y, str(e.date))
        p.drawString(250, y, e.description[:35])
        p.drawString(470, y, f"{e.amount:.2f}")
        total += e.amount
        y -= 15
        if y < 50:
            p.showPage()
            y = height - 50

    y -= 20
    p.setFont("Helvetica-Bold", 11)
    p.drawString(50, y, f"Total Expenses: Rs {total:.2f}")

    p.showPage()
    p.save()
    return response


