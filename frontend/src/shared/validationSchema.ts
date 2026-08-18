import * as yup from 'yup';
import { isValidObjectId } from '@/utils';
const objectIdCheck = (value: any) => {
  return isValidObjectId(value);
}
interface BifurcationValidatorOptions {
  amountField: string;
  bifurcationField: string;
  label?: string;
}
export const validateBifurcationTotal =
  ({
    amountField,
    bifurcationField,
    label = "Amount",
  }: BifurcationValidatorOptions) =>
    function (this: yup.TestContext, value?: Record<string, any>) {
      if (!value) return true;

      const amount = Number(value[amountField] ?? 0);
      const bifurcations = value[bifurcationField];

      if (!Array.isArray(bifurcations) || bifurcations.length === 0) {
        return true;
      }

      const total = bifurcations.reduce(
        (sum: number, item: any) => sum + (Number(item.amount) || 0),
        0
      );

      if (total !== amount) {
        return this.createError({
          path: `${this.path}.${bifurcationField}`,
          message: `The total of ${label} bifurcations (${total}) must equal the ${label} amount (${amount}).`,
        });
      }

      return true;
    };
const expenseItemSchema = yup.object().shape({
  productservice: yup.string().required("Product service is required").test("is-objectid", "Invalid Product service", objectIdCheck),
  description: yup.string().optional(),
  qty: yup.number().typeError("Quantity must be a number").min(1, "Quantity must be greater than or equal to 1").required("Quantity is required"),
  rate: yup
    .number()
    .typeError("Rate must be a number").notOneOf([0], "Rate cannot be zero").required("Rate is required"),
   tax: yup.string().nullable().optional().test("is-objectid", "Invalid Tax", (value) => {
    return !value || isValidObjectId(value);
  }),
});
export {expenseItemSchema};