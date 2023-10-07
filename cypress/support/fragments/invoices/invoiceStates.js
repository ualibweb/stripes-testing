export default {
  // save messages
  invoiceCreatedMessage: 'Invoice has been saved',
  invoiceLineCreatedMessage: 'Invoice line has been saved',
  invoiceApprovedMessage: 'Invoice has been approved successfully',
  invoicePaidMessage: 'Invoice has been paid successfully',
  invoiceDeletedMessage: 'Invoice has been deleted',
  // warnings
  invoiceCanNotBeApproved:
    'Invoice can not be approved. One or more of the related orders has a workflow status of "Pending". If desired, please open the related orders before approving this invoice.',
};
