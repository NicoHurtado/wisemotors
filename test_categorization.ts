
import { categorizeQuery } from './lib/ai/categorization';

async function main() {
  const query = "Quiero un byd comodo para la familia";
  console.log(`Testing query: "${query}"`);

  const result = await categorizeQuery(query);
  console.log("Categorization Result:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
