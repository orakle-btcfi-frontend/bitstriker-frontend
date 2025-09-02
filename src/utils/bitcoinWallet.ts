import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

// Buffer는 main.tsx에서 전역 설정됨

// ECC 라이브러리 초기화
bitcoin.initEccLib(ecc);

// ECPair 팩토리 초기화
const ECPair = ECPairFactory(ecc);

export type AddressType = 'segwit';
export type NetworkType = 'mutinynet';

export interface GeneratedWallet {
  address: string;
  privateKey: string;
  publicKey: string;
  wif: string;
  type: AddressType;
  network: NetworkType;
}

export interface MutinyNetConfig {
  signetchallenge: string;
  addnode: string;
  signetblocktime: number;
  rpcport: number;
  port: number;
}

export class BitcoinWalletGenerator {
  private network: bitcoin.Network;
  private networkType: NetworkType;
  private mutinyNetConfig?: MutinyNetConfig;

  constructor(networkType: NetworkType = 'mutinynet') {
    this.networkType = networkType;
    this.network = bitcoin.networks.testnet;

    this.mutinyNetConfig = {
      signetchallenge:
        '512102f7561d208dd9ae99bf497273e16f389bdbd6c4742ddb8e6b216e64fa2928ad8f51ae',
      addnode: '45.79.52.207:38333',
      signetblocktime: 30,
      rpcport: 38332,
      port: 38333,
    };
  }

  /**
   * 새로운 Bitcoin 지갑 생성 (SegWit만 지원)
   */
  generateWallet(type: AddressType = 'segwit'): GeneratedWallet {
    try {
      // 새 키 쌍 생성
      const keyPair = ECPair.makeRandom({ network: this.network });

      if (!keyPair.privateKey || !keyPair.publicKey) {
        throw new Error('키 쌍 생성에 실패했습니다');
      }

      const privateKey = Buffer.from(keyPair.privateKey).toString('hex');
      const publicKey = Buffer.from(keyPair.publicKey).toString('hex');
      const wif = keyPair.toWIF();

      // SegWit 주소 생성
      const address = this.generateSegWitAddress(keyPair);

      return {
        address,
        privateKey,
        publicKey,
        wif,
        type: 'segwit',
        network: this.networkType,
      };
    } catch (error) {
      throw new Error(
        `지갑 생성 실패: ${
          error instanceof Error ? error.message : '알 수 없는 오류'
        }`
      );
    }
  }

  /**
   * 개인키로부터 지갑 복원 (SegWit만 지원)
   */
  restoreWallet(
    privateKeyHex: string,
    type: AddressType = 'segwit'
  ): GeneratedWallet {
    try {
      // 개인키 검증
      if (privateKeyHex.length !== 64) {
        throw new Error('개인키는 64자리 16진수여야 합니다');
      }

      // 16진수 형식 검증
      if (!/^[0-9a-fA-F]{64}$/.test(privateKeyHex)) {
        throw new Error('개인키는 유효한 16진수 형식이어야 합니다');
      }

      const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
      const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, {
        network: this.network,
      });

      if (!keyPair.privateKey || !keyPair.publicKey) {
        throw new Error('유효하지 않은 개인키입니다');
      }

      const publicKey = Buffer.from(keyPair.publicKey).toString('hex');
      const wif = keyPair.toWIF();

      // SegWit 주소 생성
      const address = this.generateSegWitAddress(keyPair);

      return {
        address,
        privateKey: privateKeyHex,
        publicKey,
        wif,
        type: 'segwit',
        network: this.networkType,
      };
    } catch (error) {
      throw new Error(
        `지갑 복원 실패: ${
          error instanceof Error ? error.message : '알 수 없는 오류'
        }`
      );
    }
  }

  /**
   * Native SegWit (bech32) 주소 생성 - bc1... 또는 tb1...
   */
  private generateSegWitAddress(keyPair: any): string {
    try {
      const payment = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: this.network,
      });

      if (!payment.address) {
        throw new Error('SegWit 주소 생성에 실패했습니다');
      }

      return payment.address;
    } catch (error) {
      throw new Error('SegWit 주소 생성에 실패했습니다');
    }
  }

  /**
   * 주소 유효성 검증
   */
  static validateAddress(
    address: string,
    network: NetworkType = 'mutinynet'
  ): boolean {
    try {
      bitcoin.address.toOutputScript(address, bitcoin.networks.testnet);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 네트워크 정보 반환
   */
  getNetworkInfo(): {
    type: NetworkType;
    name: string;
    addressPrefix: string;
    explorerUrl: string;
    faucetUrl: string;
    rpcPort: number;
    p2pPort: number;
  } {
    return {
      type: 'mutinynet',
      name: 'MutinyNet (Signet)',
      addressPrefix: 'tb1',
      explorerUrl: 'https://mutinynet.com',
      faucetUrl: 'https://faucet.mutinynet.com',
      rpcPort: 38332,
      p2pPort: 38333,
    };
  }

  /**
   * MutinyNet 설정 정보 반환
   */
  getMutinyNetConfig(): MutinyNetConfig | null {
    return this.mutinyNetConfig || null;
  }
}
