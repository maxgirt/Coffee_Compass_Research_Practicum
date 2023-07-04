# Generated by Django 4.2.2 on 2023-07-03 15:43

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("yelp_api", "0002_delete_cafe"),
    ]

    operations = [
        migrations.CreateModel(
            name="Cafe",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("address", models.CharField(max_length=255)),
                ("rating", models.DecimalField(decimal_places=1, max_digits=3)),
                ("latitude", models.FloatField()),
                ("longitude", models.FloatField()),
            ],
        ),
    ]
