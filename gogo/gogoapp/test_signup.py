from django.test import TestCase
from .models import CustomUser

class SignupTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        print("setUpTestData: Run once to set up non-modified data for all class methods.")
        pass
    def setUp(self):
        print("setUpTestData: Run once to set up non-modified data for all class methods.")
        test1 = CustomUser.objects.create_user(username='testuser1', nationality='barbadian',password='Ignorante1234')
        test2 = CustomUser.objects.create_user(username='testuser2', nationality='barbadian',password='Ignorante1234')
        test3 = CustomUser.objects.create_user(username='testuser3', nationality='barbadian',password='Ignorante1234')
        test4 = CustomUser.objects.create_user(username='testuser4', nationality='barbadian',password='Ignorante1234')
        test5 = CustomUser.objects.create_user(username='testuser5', nationality='barbadian',password='Ignorante1234')
        test6 = CustomUser.objects.create_user(username='testuser6', nationality='barbadian',password='Ignorante1234')
        test7 = CustomUser.objects.create_user(username='testuser7', nationality='barbadian',password='Ignorante1234')
        test8 = CustomUser.objects.create_user(username='testuser8', nationality='barbadian',password='Ignorante1234')
        test9 = CustomUser.objects.create_user(username='testuser9', nationality='barbadian',password='Ignorante1234')
        test10 = CustomUser.objects.create_user(username='testuser10', nationality='barbadian',password='Ignorante1234')
        test1.save()
        test2.save()
        test3.save()
        test4.save()
        test5.save()
        test6.save()
        test7.save()
        test8.save()
        test9.save()
        test10.save()
    def test_false_is_false(self):
        print("Method: test_false_is_false.")
        self.assertFalse(False)

    def test_false_is_true(self):
        print("Method: test_false_is_true.")
        pass

    def test_one_plus_one_equals_two(self):
        print("Method: test_one_plus_one_equals_two.")
        self.assertEqual(1 + 1, 2)
