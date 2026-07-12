const app = require('./index');
const port = 3000;
app.listen(port, () => {
  console.log(`[Dev Server] Express app listening at http://localhost:${port}`);
});
