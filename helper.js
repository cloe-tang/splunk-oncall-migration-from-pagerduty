// Import Library
const fs = require("fs");
const util = require("util");
const helper = require("./helper");
const request = require("request-promise-native");
require("dotenv").config();


// Setting Variables
const SPLUNK_API_BASE_URL = "https://api.victorops.com/api-public";

const getTeam = async () => {
  try {
    const payload = {
      headers: {
        "X-VO-Api-Id": process.env.SPLUNK_API_ID,
        "X-VO-Api-Key": process.env.SPLUNK_API_KEY,
      },
      method: "get",
      url: `${SPLUNK_API_BASE_URL}/v1/team`,
      json: true,
    };
    const result = await request(payload);
    return result;
  } catch (e) {
    console.log(e);
    return e;
  }
};

const getTeamMapping = async () => {
  const allTeams = await getTeam();
  if (allTeams && allTeams.length) {
    let mapping = {};
    for (const team of allTeams) {
      mapping[team.name] = team.slug;
    }
    return mapping;
  }
};

const getRotationSlug = async (teamSlug, label) => {
  try {
    const payload = {
      headers: {
        "X-VO-Api-Id": process.env.SPLUNK_API_ID,
        "X-VO-Api-Key": process.env.SPLUNK_API_KEY,
      },
      method: "get",
      url: `${SPLUNK_API_BASE_URL}/v1/teams/${teamSlug}/rotations`,
      json: true,
    };
    const result = await request(payload);
    for (const rotationGroup of result.rotationGroups) {
      if (rotationGroup.label === label) {
        return rotationGroup.slug;
      }
    }
    return false;
  } catch (e) {
    console.log(e);
    return e;
  }
};

const getUsername = async (id) => {

  // Read PagerDuty List User JSON to find user email
  const pdfilename = `pd-list-user.json`

  const fileContent = await fs.readFileSync(pdfilename);
  const parsedFileContent = JSON.parse(fileContent);

  try {

    let user_email;
    for (const user of parsedFileContent) {
      if (user.id === id) {
        user_email = user.email;
        break;
      }
    }

    const payload = {
      headers: {
        "X-VO-Api-Id": process.env.SPLUNK_API_ID,
        "X-VO-Api-Key": process.env.SPLUNK_API_KEY,
      },
      method: "get",
      url: `${SPLUNK_API_BASE_URL}/v1/user`,
      json: true,
    };
    const result = await request(payload);
    for (const user of result.users[0]) {
      if (user.email === user_email) {
        return user.username;
      }
    }
    return false;
  } catch (e) {
    console.log(e);
    return e;
  }
};

const createPolicy = async (policy) => {
  try {
    const payload = {
      headers: {
        "X-VO-Api-Id": process.env.SPLUNK_API_ID,
        "X-VO-Api-Key": process.env.SPLUNK_API_KEY,
      },
      method: "POST",
      url: `${SPLUNK_API_BASE_URL}/v1/policies`,
      json: policy,
    };
    const result = await request(payload);
    return result;
  } catch (e) {
    console.log(e);
    return e;
  }
};

const getEscalationPolicySlug = async (policyName, team) => {
  try {
    const payload = {
      headers: {
        "X-VO-Api-Id": process.env.SPLUNK_API_ID,
        "X-VO-Api-Key": process.env.SPLUNK_API_KEY,
      },
      method: "get",
      url: `${SPLUNK_API_BASE_URL}/v1/policies`,
      json: true,
    };
    const result = await request(payload);
    for (const policy of result.policies) {
      if (policy.policy.name === policyName && policy.team.slug === team) {
        console.log(policy.policy.slug);
        return policy.policy.slug;
      }
    }
    return false;
  } catch (e) {
      console.log(e);
      return e;
    }
};

const createRoutingKey = async (policy) => {
  try {
    const payload = {
      headers: {
        "X-VO-Api-Id": process.env.SPLUNK_API_ID,
        "X-VO-Api-Key": process.env.SPLUNK_API_KEY,
      },
      method: "POST",
      url: `${SPLUNK_API_BASE_URL}/v1/org/routing-keys`,
      json: policy,
    };
    const result = await request(payload);
    return result;
  } catch (e) {
    console.log(e);
    return e;
  }
};

module.exports = {
  getTeamMapping,
  getRotationSlug,
  getUsername,
  createPolicy,
  getEscalationPolicySlug,
  createRoutingKey,
};
