import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();

      if (total < value) {
        throw new AppError('Out of balance');
      }
    }

    const existingCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    let category_id: string;

    if (existingCategory) {
      category_id = existingCategory.id;
    } else {
      const newCategory = categoriesRepository.create({ title: category });
      const createdCategory = await categoriesRepository.save(newCategory);
      category_id = createdCategory.id;
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id,
    });
    const cretedTransaction = await transactionsRepository.save(transaction);

    return cretedTransaction;
  }
}

export default CreateTransactionService;
