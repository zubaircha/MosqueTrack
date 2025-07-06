from django.contrib import admin
from .models import CustomUser, FundCollection, Expense, Pay, Person
from django.contrib.auth.admin import UserAdmin

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username', 'mobile_number', 'is_approved', 'is_staff')
    list_filter = ('is_approved', 'is_staff', 'is_superuser')
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('mobile_number', 'is_approved')}), 
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('mobile_number', 'is_approved')}), 
    )

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(FundCollection)
admin.site.register(Expense)
admin.site.register(Pay)

# ✅ Add this
@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']
