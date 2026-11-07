# ASH - DBMS Learning Platform Dockerfile for Render & Production
FROM php:8.2-apache

# Set maintainer metadata
LABEL maintainer="ASH - DBMS Learning Platform"

# Install required system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod rewrite headers

# Set DocumentRoot and working directory
WORKDIR /var/www/html

# Copy project files into container
COPY . /var/www/html/

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set ownership and permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Default exposed port (Render will inject $PORT)
EXPOSE 80

# Run entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
