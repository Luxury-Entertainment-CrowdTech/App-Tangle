import binascii
import os

# Genera una clave secreta segura
clave_secreta = binascii.hexlify(os.urandom(24)).decode()
print(clave_secreta)