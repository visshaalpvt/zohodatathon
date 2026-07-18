if (typeof catalyst !== 'undefined') {
  catalyst.initApp({
    project_Id: "50276000000016025",
    zaid: "50043296508",
    auth_domain: "https://accounts.zohoportal.in",
    is_appsail: false,
    stratus_domain: "-development.zohostratus.in",
    nimbus_domain: "-development.nimbuspop.com",
    api_domain: ""
  }, {
    org_id: "60074947232"
  });
  console.log('[Catalyst SDK] Local init.js executed successfully.');
} else {
  console.warn('[Catalyst SDK] catalyst global object not found during init.js execution.');
}
