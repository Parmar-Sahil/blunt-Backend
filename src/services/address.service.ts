import addressRepository from "../repositories/address.repository.js";
import { IAddress } from "../models/address.model.js";
import { NotFoundError } from "../utils/errors.js";

export class AddressService {
  async getAddressById(id: string): Promise<IAddress> {
    const item = await addressRepository.findById(id);
    if (!item) throw new NotFoundError("ADDRESS NOT FOUND");
    return item;
  }

  async listUserAddresses(userId: string): Promise<IAddress[]> {
    return addressRepository.findByUser(userId);
  }

  async createAddress(data: Partial<IAddress>): Promise<IAddress> {
    return addressRepository.create(data);
  }

  async updateAddress(id: string, updateData: Partial<IAddress>): Promise<IAddress> {
    const item = await addressRepository.update(id, updateData);
    if (!item) throw new NotFoundError("ADDRESS NOT FOUND");
    return item;
  }

  async deleteAddress(id: string): Promise<void> {
    const item = await addressRepository.delete(id);
    if (!item) throw new NotFoundError("ADDRESS NOT FOUND");
  }
}

export const addressService = new AddressService();
export default addressService;
