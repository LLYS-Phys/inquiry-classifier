import { createClassifier } from './config.js';
import { createApp } from './server.js';

const port = Number(process.env.PORT ?? 3000);
const classifier = createClassifier();
const app = createApp(classifier);

app.listen(port, () => {
  console.log(
    `Сървърът слуша на http://localhost:${port} (AI_PROVIDER=${process.env.AI_PROVIDER ?? 'none'})`,
  );
});
