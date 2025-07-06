from rest_framework import serializers
from .models import CustomUser, FundCollection, Expense, Pay,Person
from django.contrib.auth.password_validation import validate_password

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'confirm_password', 'mobile_number']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match.")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')

        # ✅ Create the user (initially active=False, is_approved=False)
        user = CustomUser.objects.create_user(**validated_data)
        user.is_active = False
        user.is_approved = False
        user.save()

        return user

class FundCollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundCollection
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

class PaySerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.name', read_only=True)

    class Meta:
        model = Pay
        fields = ['id', 'person', 'person_name', 'amount', 'description', 'month']

class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['id', 'name']

class UserApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'mobile_number', 'is_approved', 'date_joined']        
