import apiService from '@/service/apiService';
import { IChartAccount } from '@/types';
import { useQuery } from '@tanstack/react-query';

const useDepositToOptions = (multiname?:string[],) => {
    const { data:DepositToOptions, isLoading:depositToLoading } = useQuery<{ value: string | undefined; label: string;disabled:boolean }[]>({
        queryKey: ['depositToOptions'],
        queryFn: () => apiService.getChartAccounts({multiname:multiname?.join(","),isChartData:"0",nor:"",isProductServicesPage:"0"}).then((res: {
            data:{
                data: IChartAccount[]
            }
        }) => {
            const arr: { value: string | undefined; label: string; disabled: boolean }[] = res.data.data.map((item) => ({
                value: item._id,
                label: item.name,
                disabled: false
            }))
            arr.unshift({
                value: '',
                label: 'Deposit to',
                disabled: true
            })
            return arr
        }).catch((err) => {
            return [{
                value: '',
                label: 'Deposit to',
                disabled: true
            }]
        }),
    })
    return { DepositToOptions:Array.isArray(DepositToOptions)?DepositToOptions:[], depositToLoading }
}

export default useDepositToOptions