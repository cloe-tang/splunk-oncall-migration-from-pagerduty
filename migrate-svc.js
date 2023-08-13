// Import Libs
const fs = require("fs");
const util = require("util");
const helper = require("./helper");

// Set PagerDuty's "services" Export (file in JSON)
const fileName = `<<Pagerduty Service Exported Config>>.json`;
let onboardTeam = `<<Team to onboard>>`;

(async () => {
  const fileContent = await fs.readFileSync(fileName);
  const parsedFileContent = JSON.parse(fileContent);
  const newRoutingKeyAry = [];


  for (const team of parsedFileContent) {
    
    // Break loop if not the intended team
    if (team.summary != onboardTeam) {
      continue;
    }

    // Exit Program if No Services Detected
    if (
      !team.services ||
      team.services.length === 0
    ) {
      return false;
    }

    // Main
    const teamMapping = await helper.getTeamMapping(); // Get Team Mapping from Splunk
    let newTeamSlug;
    for (const service of team.services) {
      let serviceName = service.name
      let reformatServiceName = serviceName.toLowerCase().replace(" ", "-");

      console.log(reformatServiceName);

      let newRoutingKey = {
        routingKey: reformatServiceName,
        targets: [],
      }
      // Get Team Slug
      newTeamSlug = teamMapping[service.teams[0].summary];

      // Get Escalation Policy Slug
      let escalationPolicySlug = await helper.getEscalationPolicySlug(
        service.escalation_policy.summary,
        newTeamSlug
      );
      newRoutingKey.targets.push(escalationPolicySlug);
      newRoutingKeyAry.push(newRoutingKey);
    }
  }

  // Remove Default RoutingKey to prevent creating it in Splunk
  let removalIndex = null;
  for (const [i, p] of newRoutingKeyAry.entries()) {
    if (p.routingKey === "Default") {
      removalIndex = i;
      break;
    }
  }
  if (removalIndex && removalIndex >= 0) {
    newRoutingKeyAry.splice(removalIndex, 1);
  }

  // Create RoutingKey in Splunk
  console.log("Starting process to create Routing Key in Splunk...");
  console.log(
    `Creating a total of ${newRoutingKeyAry.length}`  // Create Routing Key in Splunk
  );
  console.log(`=========================================`);

  for (const [i, p] of newRoutingKeyAry.entries()) {
    console.log(`Creating ${i + 1}/${newRoutingKeyAry.length} routing key...`);
    const createRoutingKeyResult = await helper.createRoutingKey(p);
    if (createRoutingKeyResult) {
      console.log(
        `Successfully created routing key with name: ${createRoutingKeyResult.routingKey}`
      );
    } else {
      console.log(`Failed to create routing key. See error below:`);
      console.log(createRoutingKeyResult);
    }
  }
})();
