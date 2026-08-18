interface Service {
  _id: string;
  value: string;
}

const getServiceType = (serviceId: string, itemServices: Service[] = []): string => {
    const service = itemServices.find((s) => s._id === serviceId);
    return service ? service.value : "number"; // Default to "text" if not found
  };
export   {getServiceType}