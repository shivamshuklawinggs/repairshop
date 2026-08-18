import AccountTypeModel from 'models/AccountType.model';
import AccountDetailType from 'models/accountDetailType.model';
import accountTypesJson from 'microservices/chart-accounts-services/services/accounttypes.json';
import subAccountTypesJson from 'microservices/chart-accounts-services/services/subaccounttypes.json';
import { ClientSession } from 'mongoose';

const seedAccountTypes = async ({session}:{session:ClientSession}) => {
  try {
    console.log('Seeding parent account types...');

    await AccountTypeModel.bulkWrite(
      accountTypesJson.map((item) => ({
        updateOne: {
          filter: {
            typeId: item.typeId,
          },
          update: {
            $set: item,
          },
          upsert: true,
        },
      })),
      {
        ordered: false,
        session:session
      }
    );

    console.log('Parent account types seeded successfully!');

    await AccountDetailType.bulkWrite(
      subAccountTypesJson.map((item) => ({
        updateOne: {
          filter: {
            detailTypeId: item.detailTypeId,
          },
          update: {
            $set: item,
          },
          upsert: true,
        },
      })),
      {
        ordered: false,
        session:session
      }
    );

    console.log('Detail account types seeded successfully!');
  } catch (error) {
    console.error('Error seeding account types:', error);
    throw error;
  }
};

export default seedAccountTypes;