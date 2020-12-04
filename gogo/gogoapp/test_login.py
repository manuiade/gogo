from django.test import TestCase, Client
from .models import CustomUser
from django.urls import reverse

class LoginTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        print("setUpTestData: Run once to set up non-modified data for all class methods.")
        pass
    def setUp(self):
        print("setUpTestData: Run once to set up non-modified data for all class methods.")
        c = Client()
        credentials = {'username' : 'Davie', 'password' : 'Progetto1234'}
        logged = self.client.post(path="/gogoapp/login/",data=credentials)
        print(logged.status_code)
        #response = c1.get(reverse('/welcome/get_statistics?username=Sgarbi'))
        #print(self.client.get('/welcome/get_statistics?username=Davide',follow=True))
        print("ciao")
        '''
        cx = Client()
        c2.login('/login/', {'username' : 'testuser2', 'password' : 'Ignorante1234')
        c3.login('/login/', {'username' : 'testuser3', 'password' : 'Ignorante1234')
        c4.login('/login/', {'username' : 'testuser4', 'password' : 'Ignorante1234')
        c5.login('/login/', {'username' : 'testuser5', 'password' : 'Ignorante1234')
        c6.login('/login/', {'username' : 'testuser6', 'password' : 'Ignorante1234')
        c7.login('/login/', {'username' : 'testuser7', 'password' : 'Ignorante1234')
        c8.login('/login/', {'username' : 'testuser8', 'password' : 'Ignorante1234')
        c9.login('/login/', {'username' : 'testuser9', 'password' : 'Ignorante1234')
        c10.login('/login/', {'username' : 'testuser10', 'password' : 'Ignorante1234')
        '''
    '''
    def test_false_is_false(self):
        print("Method: test_false_is_false.")
        self.assertFalse(False)

    def test_false_is_true(self):
        print("Method: test_false_is_true.")
        self.assertTrue(False)
    '''
    def test_one_plus_one_equals_two(self):
        print("Method: test_one_plus_one_equals_two.")
        self.assertEqual(1 + 1, 2)
    
