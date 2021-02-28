docker build \
--build-arg MQTT_USER="TEST-USER" \
--build-arg MQTT_HOST="TEST-HOST" \
--build-arg MQTT_PASSWORD="TEST-PASSWORD" \
--build-arg MQTT_PORT="TEST-PORT" \
-t "test/test" .