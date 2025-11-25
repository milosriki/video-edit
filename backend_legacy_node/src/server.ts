import { app } from './index.js';

const port = parseInt(process.env.PORT || '8080');
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
