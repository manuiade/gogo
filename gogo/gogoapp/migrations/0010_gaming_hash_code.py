# Generated by Django 3.0.3 on 2020-02-18 10:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gogoapp', '0009_auto_20200217_1641'),
    ]

    operations = [
        migrations.AddField(
            model_name='gaming',
            name='hash_code',
            field=models.IntegerField(default=0),
        ),
    ]
