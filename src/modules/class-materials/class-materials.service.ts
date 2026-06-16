import { materialCrudService } from './services/material-crud.service';
import { materialQueryService } from './services/material-query.service';

// Aggregator — business logic split across services/, repository handles DB.
export const classMaterialsService = {
  create: materialCrudService.create,
  update: materialCrudService.update,
  remove: materialCrudService.remove,
  list: materialQueryService.list,
  getById: materialQueryService.getById,
  download: materialQueryService.download,
  viewUrl: materialQueryService.viewUrl,
  stream: materialQueryService.stream,
};
