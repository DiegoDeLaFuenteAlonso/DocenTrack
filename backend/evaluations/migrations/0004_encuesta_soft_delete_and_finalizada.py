from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('evaluations', '0003_alumno_dashboard_support'),
    ]

    operations = [
        migrations.AddField(
            model_name='encuesta',
            name='eliminada',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='encuesta',
            name='finalizada',
            field=models.BooleanField(default=False),
        ),
    ]
