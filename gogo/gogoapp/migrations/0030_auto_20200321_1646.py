# Generated by Django 3.0.3 on 2020-03-21 16:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gogoapp', '0029_auto_20200321_1504'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='loserate',
            field=models.FloatField(default=0),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='winrate',
            field=models.FloatField(default=0),
        ),
    ]
