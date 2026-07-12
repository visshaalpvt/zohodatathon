const { getDashboard } = require("../services/dashboard.service");

async function dashboard(req, res) {

    const result = await getDashboard(req);

    res.end(JSON.stringify(result));

}

module.exports = {

    dashboard

};