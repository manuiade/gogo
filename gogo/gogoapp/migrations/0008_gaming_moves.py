# Generated by Django 3.0.3 on 2020-02-17 16:36

from django.db import migrations, models
import django_mysql.models


class Migration(migrations.Migration):

    dependencies = [
        ('gogoapp', '0007_gaming_id_move'),
    ]

    operations = [
        migrations.AddField(
            model_name='gaming',
            name='moves',
            field=django_mysql.models.ListCharField(models.IntegerField(default=0), max_length=362, null=True, size=81),
        ),
    ]