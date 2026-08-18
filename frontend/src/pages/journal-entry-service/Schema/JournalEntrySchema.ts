import * as yup from 'yup';
const journalEntrySchema = yup.object().shape({
  journalDate: yup.date().required().label("Journal Entry Date"),
  postingDate: yup.date().required().label("Posting Date"),
  journalNumber: yup.string().required('Journal number is required').label("Journal Number"),
  entries: yup.array().of(
    yup.object().shape({
      account: yup.string().required('Account is required').label("Account"),
      debit: yup.number().required("Debit is required").min(0,"Minimum 0 Debit is required").default(0).transform((value) =>!value?0: Number(value)),
      credit: yup.number().required("Credit is required").min(0,"Minimum 0 Credit is required").default(0).transform((value) =>!value?0: Number(value)),
      description: yup.string().optional(),
      nameId: yup.string().label("Entry Name").optional().nullable().transform((value) => !value?null:value).test("nameId", "Name is required", (value,context) => {
        if(context.parent.nameModel==="Customer" || context.parent.nameModel==="Carrier"){
          if(!value){
            return false;
          }
        }
        return true;
      }),
      nameModel: yup.string().nullable().oneOf(['Customer', 'Carrier', null]).default(null).optional().label("Name Model"),
    })
  ).min(1, 'At least one entries are required').label("Entries"),
  memo: yup.string().optional().label("Memo"),
  attachments: yup.mixed().optional().label("Attachments"),
}).test("balance", "Totals do not balance", (value,{createError}) => {
  const totalDebit = value?.entries?.reduce((sum, entry) => sum + (entry.debit || 0), 0) || 0
  const totalCredit = value?.entries?.reduce((sum, entry) => sum + (entry.credit || 0), 0) || 0
  if(totalDebit !== totalCredit){
      // create new error
    return createError({message:"Totals do not balance . Diffrence : $"+(totalDebit-totalCredit),type:"balance"})
  }
  return true
})
  export type IJournalEntry = yup.InferType<typeof journalEntrySchema>;
  export  {journalEntrySchema}