# Generated by Django 3.0.3 on 2020-03-09 09:32

from django.db import migrations, models
import django_mysql.models


class Migration(migrations.Migration):

    dependencies = [
        ('gogoapp', '0025_auto_20200307_1049'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gaming',
            name='moves',
            field=django_mysql.models.ListCharField(models.IntegerField(default=0), default=0, max_length=500, size=500),
        ),
    ]
