# Generated by Django 3.0.3 on 2020-02-25 11:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gogoapp', '0018_history'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gaming',
            name='eat_ball',
            field=models.IntegerField(default=-1),
        ),
    ]
