#!/usr/bin/python3

import http.client
import urllib.request
import urllib.parse
import urllib.error

#preout = sys.argv[1].split(".js")[0]
#out = preout + ".min.js"

with open('wavybits.js') as f:
    js = "".join(f.readlines())

params = urllib.parse.urlencode([
    ('js_code', js),
    ('compilation_level', 'ADVANCED_OPTIMIZATIONS'),
    ('output_format', 'text'),
    ('output_info', 'compiled_code'),
])

headers = {"Content-type": "application/x-www-form-urlencoded"}
conn = http.client.HTTPConnection('closure-compiler.appspot.com')
conn.request('POST', '/compile', params, headers)
response = conn.getresponse()
data = response.read()
data = data.decode("utf-8")
data = data.replace('600', 'Y')
data = data.replace('99', 'Z')
data = data.replace('9801', 'Z*Z')
data = data.replace('0.1', '.1')
data = data.split("\n")

data = "".join(data[1:])
data = data[12:-5]
data = 'Y=600;Z=99;' + data

with open('wavybits-compiled.js', 'w') as f:
    f.write(data)

conn.close()

print(len(data))
