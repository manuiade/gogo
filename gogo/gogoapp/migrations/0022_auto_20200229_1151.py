# Generated by Django 3.0.3 on 2020-02-29 11:51

from django.db import migrations, models
import django_mysql.models


class Migration(migrations.Migration):

    dependencies = [
        ('gogoapp', '0021_auto_20200225_1603'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gaming',
            name='moves',
            field=django_mysql.models.ListCharField(models.IntegerField(default=0), default=0, max_length=400, size=81),
        ),
    ]