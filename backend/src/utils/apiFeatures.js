'use strict';

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((f) => delete queryObj[f]);

    // Advanced filtering: gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|nin)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  search(fields = ['name']) {
    if (this.queryString.search) {
      const searchRegex = new RegExp(this.queryString.search, 'i');
      const searchConditions = fields.map((f) => ({ [f]: searchRegex }));
      this.query = this.query.find({ $or: searchConditions });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = Math.max(1, parseInt(this.queryString.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(this.queryString.limit) || 20));
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.paginationInfo = { page, limit, skip };
    return this;
  }
}

module.exports = APIFeatures;
