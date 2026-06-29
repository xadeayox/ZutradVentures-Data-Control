Check:
1. The .env file in the backend
2. The ReportsMessage component in pages/reports on the frontend
3. api.ts on the frontend
To change the links from local host to the link you are using as a host. The Elastic Beanstalk link is the default since its hosted on AWS for now.

The .env file for the mongodb backend also has a MONGO_URI key. Change it if necessary when hosting on another instance.
