from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    
    path('me/', get_user_info),
    path('funds/', add_fund), 
    path('register/', register_user),
    path('login/', login_view),
    
    path('me/', get_user_info),
    path('funds/', add_fund),      
    path('expenses/', add_expense),
    path('persons/add/', create_person),
    path('pay/', add_pay),
    path('summary/', summary),
    path('persons/', person_list),
    path('pay/status-summary/', pay_status_summary),
    path('pay/summary/', monthly_pay_summary),
    path('pay/search-names/', search_names),
    path('pay/pdf/', pay_pdf_report),
    path('summary/pdf/', funds_expenses_pdf_report),
    path('pdf/donations/', donation_pdf_report),
    path('pdf/expenses/', expense_pdf_report),
    path('admin/pending-users/', pending_users),
    path('admin/approve-user/<int:user_id>/',approve_user),
    path('admin/decline-user/<int:user_id>/',decline_user),
     path('pay/unpaid/', unpaid_persons_summary),
      path('me/', get_user_info),

]
