import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

// ECC 라이브러리 초기화
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

// 환경변수 가져오기
const ADMIN_PRIVATE_KEY =
  import.meta.env.VITE_ADMIN_PRIVATE_KEY ||
  '1a1fe8c2644ad53069f2fdbfc93e7a2b66811beebecf0ad453c8a58051bee8d4';
const ADMIN_ADDRESS =
  import.meta.env.VITE_ADMIN_ADDRESS ||
  'tb1qch7l3vuuzdldhjx908f40cpjxu0pzkhtd3j3m5';

interface UTXO {
  txid: string;
  vout: number;
  value: number;
}

interface TransactionResult {
  success: boolean;
  txid?: string;
  fee?: number;
  explorerUrl?: string;
  error?: string;
}

export class MutinyNetSender {
  private readonly MUTINYNET_API_BASE = 'https://mutinynet.com/api';
  private readonly network = bitcoin.networks.testnet;

  /**
   * 주소의 UTXO 조회
   */
  async getUTXOs(address: string): Promise<UTXO[]> {
    const response = await fetch(
      `${this.MUTINYNET_API_BASE}/address/${address}/utxo`
    );
    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }
    return await response.json();
  }

  /**
   * 주소 잔액 조회
   */
  async getBalance(address: string): Promise<number> {
    const response = await fetch(
      `${this.MUTINYNET_API_BASE}/address/${address}`
    );
    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }
    const data = await response.json();
    return data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
  }

  /**
   * 트랜잭션 브로드캐스트
   */
  async broadcastTransaction(txHex: string): Promise<string> {
    const response = await fetch(`${this.MUTINYNET_API_BASE}/tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: txHex,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`브로드캐스트 실패: ${error}`);
    }

    return await response.text();
  }

  /**
   * Admin 지갑에서 사용자 지갑으로 테스트 코인 전송
   */
  async sendTestCoins(
    toAddress: string,
    amount: number = 1000
  ): Promise<TransactionResult> {
    const fromAddress = ADMIN_ADDRESS;
    const privateKeyHex = ADMIN_PRIVATE_KEY;

    console.log('🪙 테스트 코인 전송');
    console.log('==================');
    console.log(`📤 Admin: ${fromAddress}`);
    console.log(`📥 사용자: ${toAddress}`);
    console.log(`💰 금액: ${amount} satoshis`);

    try {
      // 1. Admin 지갑 잔액 확인
      const balance = await this.getBalance(fromAddress);
      console.log(`💰 Admin 잔액: ${balance} satoshis`);

      if (balance < amount + 1000) {
        throw new Error(`Admin 지갑 잔액 부족: ${balance} < ${amount + 1000}`);
      }

      // 2. UTXO 조회
      const utxos = await this.getUTXOs(fromAddress);
      if (utxos.length === 0) {
        throw new Error('사용 가능한 UTXO가 없습니다');
      }

      // 가장 큰 UTXO 선택
      const selectedUtxo = utxos.sort((a, b) => b.value - a.value)[0];
      console.log(`📦 선택된 UTXO: ${selectedUtxo.value} sats`);

      // 3. 트랜잭션 생성
      const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
      const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, {
        network: this.network,
      });

      const psbt = new bitcoin.Psbt({ network: this.network });

      // 입력 추가
      psbt.addInput({
        hash: selectedUtxo.txid,
        index: selectedUtxo.vout,
        witnessUtxo: {
          script: bitcoin.address.toOutputScript(fromAddress, this.network),
          value: selectedUtxo.value,
        },
      });

      // 출력 추가 - 사용자
      psbt.addOutput({
        address: toAddress,
        value: amount,
      });

      // 출력 추가 - 거스름돈
      const fee = 1000;
      const change = selectedUtxo.value - amount - fee;

      if (change > 546) {
        // dust limit
        psbt.addOutput({
          address: fromAddress,
          value: change,
        });
      }

      console.log(`💸 수수료: ${fee} satoshis`);
      console.log(`🔄 거스름돈: ${change} satoshis`);

      // 서명
      const signer = {
        publicKey: Buffer.from(keyPair.publicKey),
        sign: (hash: Buffer) => Buffer.from(keyPair.sign(hash)),
      };
      psbt.signInput(0, signer);
      psbt.finalizeAllInputs();

      const tx = psbt.extractTransaction();
      const txHex = tx.toHex();

      // 4. 브로드캐스트
      const broadcastTxid = await this.broadcastTransaction(txHex);
      const txid = broadcastTxid.trim();

      console.log(`✅ 성공! TXID: ${txid}`);

      return {
        success: true,
        txid,
        fee,
        explorerUrl: `https://mutinynet.com/tx/${txid}`,
      };
    } catch (error) {
      console.error('❌ 전송 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
