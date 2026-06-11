import { createClient, createAccount } from 'genlayer-js';
import { localnet } from 'genlayer-js/chains';
import { readFileSync } from 'fs';

const pk = '0x' + 'a'.repeat(64);
const account = createAccount(pk);

const RPC = 'http://127.0.0.1:4000/api';
const chain = { ...localnet, rpcUrls: { default: { http: [RPC] } } };
const client = createClient({ chain, endpoint: RPC, account });

const envText = readFileSync('frontend/.env.local', 'utf-8');
const casino = envText.match(/CASINO_ADDRESS=(0x[a-f0-9]+)/)[1];
console.log('Using account', account.address, 'casino', casino);

// Fund the account
const fundRes = await fetch(RPC, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'sim_fundAccount',
    params: [account.address.toLowerCase(), '100000000000000000000'],
  }),
}).then((r) => r.json());
console.log('fund', fundRes.result);

const balBefore = await client.getBalance({ address: account.address });
console.log('player balance before', balBefore);

for (let i = 0; i < 3; i++) {
  const tx = await client.writeContract({
    address: casino,
    functionName: 'play_coinflip',
    args: [true],
    value: 1n * 10n ** 18n,
  });
  const receipt = await client.waitForTransactionReceipt({ hash: tx, retries: 200 });
  console.log(
    `play_coinflip #${i + 1}:`,
    'status', receipt.statusName ?? receipt.status_name,
    'result', JSON.stringify(receipt.result ?? receipt.consensus_data?.leader_receipt?.[0]?.result).slice(0, 200),
  );
}

const balAfter = await client.getBalance({ address: account.address });
console.log('player balance after', balAfter);

const houseBalance = await client.readContract({
  address: casino,
  functionName: 'house_balance',
  args: [],
});
console.log('house_balance', houseBalance);

const recent = await client.readContract({
  address: casino,
  functionName: 'recent',
  args: [5],
});
console.log('recent rounds:', JSON.stringify(recent, null, 2));
