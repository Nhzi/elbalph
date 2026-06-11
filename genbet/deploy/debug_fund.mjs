import {
  createClient,
  createAccount,
} from 'genlayer-js';
import { localnet } from 'genlayer-js/chains';
import { readFileSync } from 'fs';

const ks = JSON.parse(readFileSync(process.env.HOME + '/.genlayer/keystores/default.json', 'utf-8'));

// glsim ignores signatures; any pk works
const pk = '0x' + 'a'.repeat(64);
const account = createAccount(pk);

const RPC = 'http://127.0.0.1:4000/api';
const chain = { ...localnet, rpcUrls: { default: { http: [RPC] } } };
const client = createClient({ chain, endpoint: RPC, account });

console.log('Using account', account.address);

// Read addresses from .env.local
const envText = readFileSync('frontend/.env.local', 'utf-8');
const casino = envText.match(/CASINO_ADDRESS=(0x[a-f0-9]+)/)[1];
console.log('Casino', casino);

const before = await client.readContract({
  address: casino,
  functionName: 'house_balance',
  args: [],
});
console.log('house_balance before:', before);

const tx = await client.writeContract({
  address: casino,
  functionName: 'fund_house',
  args: [],
  value: 100n * 10n ** 18n,
});
console.log('tx', tx);

const receipt = await client.waitForTransactionReceipt({ hash: tx, retries: 200 });
console.log('receipt status', receipt.statusName ?? receipt.status_name, receipt.status);
console.log('tx_data_decoded', JSON.stringify(receipt.txDataDecoded ?? receipt.tx_data_decoded ?? {}).slice(0, 300));
console.log('leader_receipt result', receipt.consensus_data?.leader_receipt?.[0]?.result?.slice?.(0, 200));

const after = await client.readContract({
  address: casino,
  functionName: 'house_balance',
  args: [],
});
console.log('house_balance after:', after);
