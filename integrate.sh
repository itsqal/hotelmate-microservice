#!/bin/bash

# Create temporary directory
mkdir -p temp-hotelease
cd temp-hotelease

# Clone the updated repository
git clone https://github.com/rafifdzaky27/tubes-iae.git

# Copy the updated services to our project
cp -r tubes-iae/room_service ../hotelease/
cp -r tubes-iae/reservation_service ../hotelease/
cp -r tubes-iae/guest_service ../hotelease/
cp -r tubes-iae/billing_service ../hotelease/

# Clean up
cd ..
rm -rf temp-hotelease

# Update environment variables
echo "Updating environment variables..."
for service in room_service reservation_service guest_service billing_service; do
    if [ -f "hotelease/$service/.env" ]; then
        sed -i 's/DB_HOST=localhost/DB_HOST=postgres/g' "hotelease/$service/.env"
    fi
done

echo "Integration complete! You can now run 'docker-compose up --build' to start all services." 