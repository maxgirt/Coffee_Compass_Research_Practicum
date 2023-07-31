"""
Django settings for yelp_integration project.

Generated by 'django-admin startproject' using Django 4.2.2.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

from pathlib import Path
from datetime import datetime
from datetime import timedelta
from celery.schedules import crontab

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-5v!xcw5wu%y0f&6h3==u$g=23uy5k4u#b5xul&lpy2+9)o+pk-"

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True


# Application definition

INSTALLED_APPS = [
    "rest_framework",
    "yelp_api",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    'corsheaders',
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    'corsheaders.middleware.CorsMiddleware',
]

ROOT_URLCONF = "yelp_integration.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "yelp_integration.wsgi.application"


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

ALLOWED_HOSTS = ['172.17.0.2','137.43.49.39','127.0.0.1', 'localhost']

DATABASES = {
    #'default': {
     #   'ENGINE': 'django.db.backends.postgresql',
      #  'NAME': 'postgres',
       # 'USER': 'postgres',
       # 'PASSWORD': 'ahorsewithnoName',
        #'HOST': 'database-1.c5bqixkyfabd.eu-west-2.rds.amazonaws.com',
        #'PORT': '5432',
    # }
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "cafes_manhattan",
        "USER": "maxgirt",
        "PASSWORD": "admin",
        "HOST": "localhost",
        "PORT": "5432",

   
}
}

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = "static/"

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://localhost:6379/0',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:8000',  # Add the origin of your frontend application

]

REDIS_HOST = '127.0.0.1'   # Replace 'your_redis_host' with the actual Redis host
REDIS_PORT = 6379                # Replace '6379' with the actual Redis port number
REDIS_DB = 0                     # Replace '0' with the actual Redis database number you want to use

# celery settings
CELERY_BROKER_URL = 'redis://localhost:6379'
CELERY_RESULT_BACKEND = 'redis://localhost:6379'
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TASK_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Europe/Dublin'

now = datetime.now()
current_day = now.weekday()
current_month = now.month
current_week_of_year = now.isocalendar()[1]


CELERY_BEAT_SCHEDULE = {
    'calculate_and_cache_predictions_task': {
        'task': 'yelp_api.tasks.calculate_and_cache_predictions',
        'schedule': crontab(hour=2, minute=0),
        'args': (current_day, current_month, current_week_of_year),
    },
}

