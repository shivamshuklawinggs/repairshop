import React, { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import FormSelect from '../ui/FormSelect'
import { useChartOfAccount } from '@/hooks/useChartOfAccount'
import ChartAccountForm from '@/pages/chart-accounts-service/ChartAccountForm'
import { Button, Dialog, DialogActions } from '@mui/material'
import { getIcon } from './icons/getIcon'
import { masterType } from '@/types'
import AppDialog from '@/components/ui/AppDialog';

export const SelectChartOfAcc: React.FC<{
  type:('asset' | 'liability' | 'equity' | 'income' | 'expense')[] | 'asset' | 'liability' | 'equity' | 'income' | 'expense',
  removeMasters:masterType[],
  regularExpression:"TAX" | "DISCOUNT"
}> = ({type,removeMasters,regularExpression}) => {
  const { control } = useFormContext<any>()
  const [showChartModal, setShowChartModal] = useState(false)

  const { chartAccountOptions } = useChartOfAccount({type, removeMasters, regularExpression,nor:[]})


  return (
    <Controller
      name="chartOfAccount"
      control={control}
      rules={{ required: 'Account type is required' }}
      render={({ field, fieldState }) => {
        const errorMessage = fieldState.error?.message
        return (
          <FormSelect
            label="Chart of Account"
            options={chartAccountOptions}
            value={chartAccountOptions.find((opt) => opt.value === field.value) || null}
            onChange={(option) => field.onChange((option as SelectOption)?.value || '')}
            placeholder="Select Chart of Account"
            isClearable
            helperText={errorMessage}
            error={errorMessage}
            addNewLabel="+ Add New Chart Account"
            addNewModal={
              <AppDialog open={showChartModal} onClose={() => setShowChartModal(false)} maxWidth="md" fullWidth>
                <DialogActions className='dialog-close'>
                  <Button onClick={() => setShowChartModal(false)}>
                    {getIcon('CloseIcon')}
                  </Button>
                </DialogActions>
                <ChartAccountForm
                  initial={undefined}
                />
              </AppDialog>
            }
            showModal={showChartModal}
            setShowModal={setShowChartModal}
            required
          />
        );
      }}
    />
  )
}
