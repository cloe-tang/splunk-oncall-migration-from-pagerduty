# splunk-oncall-migration-from-pagerduty
The purpose of these scripts is to help migrate Pagerduty Escalation Policies and Services to Splunk On-Call. 

## Pre-requisites
These scripts are written in nodejs. Perform the following to run the migration script successfully:
1. Install nodejs on the machine you are running. (https://nodejs.org/en/download)
2. Execute the following command to install the required nodejs modules
```
npm install
```
3. Create a .env in the same folder as the script. Provide the SPLUNK_API_ID and SPLUNK_API_KEY like the following 
```
SPLUNK_API_ID=<your API ID>
SPLUNK_API_KEY=<your API Key>
```


## Migrate Pagerduty Escalation Policies to Splunk On-Call
The migrate-ep.js script will read the escalation policies configuration exported via Pagerduty API and create the escalation policies in Splunk On-Call. Edit the following before executing the script. 
1. <\<Pagerduty EP Exported Config\>>.json
2. <\<Team to onboard\>> --> If you are migrating everything over, command off the following script (Line 18 - 20)
```
    if (team.summary != onboardTeam) {
      continue;
    }
```

To execute the script, simply run the following command: 
```
node migrate-ep.js
```

Things to note before executing the script:
1. Users has to be onboarded in case escalation policy is notifying the user directly
2. Schedule rotation needs to be created because the escalation policy will be referencing to the rotation
3. Pagerduty escalation timeout is a free text in the UI. When migrated to Splunk, it will be rounded up to nearest multiple of 5. For example, 3 minutes in Pagerduty will be rounded up to 5 minutes.

## Migrate Pagerduty Services to Splunk On-Call
The migrate-svc.js script will read the service configuration exported via Pagerduty API and create the routing key in Splunk On-Call. Edit the following before executing the script. 
1. <\<Pagerduty Service Exported Config\>>.json
2. <\<Team to onboard\>> --> If you are migrating everything over, command off the following script (Line 19 - 21)
```
    if (team.summary != onboardTeam) {
      continue;
    }
```

To execute the script, simply run the following command: 
```
node migrate-svc.js
```

Things to note before executing the script:
1. Escalation policies need to be created first

## Sample Result from sample config file
Escalation Policies - cart-ep
![image](https://github.com/cloe-tang/splunk-oncall-migration-from-pagerduty/assets/58005106/ee4f0cbe-87c1-47ed-9fdd-f7b827cee36e)

Routing Key - cart-service
![image](https://github.com/cloe-tang/splunk-oncall-migration-from-pagerduty/assets/58005106/322284df-1285-4446-93a3-d607e0c9bf9c)
