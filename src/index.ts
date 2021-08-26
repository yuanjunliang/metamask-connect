import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import { MetaMaskInpageProvider } from "@metamask/providers";
import { provider } from "web3-core";
import { Contract, ContractOptions } from "web3-eth-contract";
import { AbiItem } from "web3-utils";

export default class Wallet {
  account: string;
  chainId: number | null;
  web3: Web3 | undefined;
  ethereum: MetaMaskInpageProvider | undefined;
  contractMap: Map<string, Contract>;

  constructor() {
    this.account = "";
    this.chainId = null;
    this.web3 = undefined;
    this.ethereum = undefined;
    this.contractMap = new Map<string, Contract>();
  }
  async connect(): Promise<string> {
    const provider = await detectEthereumProvider({
      mustBeMetaMask: false,
    });

    if (typeof provider === "undefined" || provider === null) {
      throw Error("Please install MetaMask!");
    }
    const ethereum = provider as MetaMaskInpageProvider;
    const accounts = await ethereum.request({
      method: "eth_requestAccounts",
    });

    const account = (accounts as Array<string>)[0];
    const web3 = new Web3(ethereum as provider);
    this.account = account;
    this.chainId = Number(ethereum.chainId);
    this.web3 = web3;
    this.ethereum = ethereum;
    return this.account;
  }

  newContract(
    abi: AbiItem[] | AbiItem,
    address: string,
    options?: ContractOptions
  ): Contract {
    if (typeof this.web3 === "undefined") {
      throw Error("please init web3!");
    }
    return new this.web3.eth.Contract(abi, address, options);
  }

  setContract(name: string, contract: Contract): void {
    this.contractMap.set(name, contract);
  }

  getContract(name: string): Contract | undefined {
    return this.contractMap.get(name);
  }

  send(
    name: string,
    method: string,
    params: Array<string | number | Array<string | number>>,
    callback?: (err: Error, transactionHash: string) => void
  ): Promise<unknown> {
    const contract = this.contractMap.get(name);
    if (typeof contract === "undefined") {
      throw Error("Contract not set!");
    }
    if (typeof callback === "function") {
      return contract.methods[method](...params).send();
    }
    return contract.methods[method](...params).send();
  }

  call(
    name: string,
    method: string,
    params: Array<string | number | Array<string | number>>,
    callback?: (err: Error, transactionHash: string) => void
  ): Promise<unknown> {
    const contract = this.contractMap.get(name);
    if (typeof contract === "undefined") {
      throw Error("Contract not set!");
    }
    if (typeof callback === "function") {
      return contract.methods[method].call(...params, callback);
    }
    return contract.methods[method].call(...params);
  }
}
