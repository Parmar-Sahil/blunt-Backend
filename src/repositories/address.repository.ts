import Address, { IAddress } from "../models/address.model.js";

export class AddressRepository {
  async findById(id: string): Promise<IAddress | null> {
    return Address.findById(id).populate("user");
  }

  async findByUser(userId: string): Promise<IAddress[]> {
    return Address.find({ user: userId });
  }

  async create(data: Partial<IAddress>): Promise<IAddress> {
    const item = new Address(data);
    return item.save();
  }

  async update(id: string, updateData: Partial<IAddress>): Promise<IAddress | null> {
    return Address.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<IAddress | null> {
    return Address.findByIdAndDelete(id);
  }
}

export const addressRepository = new AddressRepository();
export default addressRepository;
