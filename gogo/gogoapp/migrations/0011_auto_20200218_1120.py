# Generated by Django 3.0.3 on 2020-02-18 11:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gogoapp', '0010_gaming_hash_code'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gaming',
            name='dim',
            field=models.IntegerField(default=9),
        ),
    ]
