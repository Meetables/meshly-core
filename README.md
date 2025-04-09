# meshly-core
The core backend for creating social networks. WIP as of now.

## A brief introduction to helping us at Meetables build meshly-core

Every Social network is following the same architecture with varations

## Get started

Use the following environment variables - either as a Docker Environment Variable or by using a .env file:

DATABASE_URL: The URL to your MongoDB instance. When deploying mehsly-core as a docker stack, it should be mongodb://mongodb-dev:27017/meshly-core by default

PORT = The port the API will be running on, 3000 by default.
When using docker, make sure to also change the port bind

JWT_SECRET= A secret (any string) that's being used for encoding the JWT Token

NODE_ENV=development The node environment. Used for configuration.

DEV_TESTUSER_EMAIL= Email address for your test user
DEV_TESTUSER_USERNAME= Username for your test user
DEV_TESTUSER_PASSWORD= Password for your test user

TAG_CATEGORIES= All of the categories a tag can have
DEFAULT_TAGS= The tags which are being added to the mongo instance on init
