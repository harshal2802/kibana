/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { AbstractField } from './field';
import { ESTooltipProperty } from '../tooltips/es_tooltip_property';
import { TooltipProperty } from '../tooltips/tooltip_property';
import { COLOR_PALETTE_MAX_SIZE } from '../../../common/constants';
import { indexPatterns } from '../../../../../../../src/plugins/data/public';

export class ESDocField extends AbstractField {
  static type = 'ES_DOC';

  async _getField() {
    const indexPattern = await this._source.getIndexPattern();
    const field = indexPattern.fields.getByName(this._fieldName);
    return indexPatterns.isNestedField(field) ? undefined : field;
  }

  async createTooltipProperty(value) {
    const indexPattern = await this._source.getIndexPattern();
    const tooltipProperty = new TooltipProperty(this.getName(), this.getName(), value);
    return new ESTooltipProperty(tooltipProperty, indexPattern, this);
  }

  async getDataType() {
    const field = await this._getField();
    return field.type;
  }

  supportsFieldMeta() {
    return true;
  }

  async getOrdinalFieldMetaRequest() {
    const field = await this._getField();

    if (field.type !== 'number' && field.type !== 'date') {
      return null;
    }

    const extendedStats = {};
    if (field.scripted) {
      extendedStats.script = {
        source: field.script,
        lang: field.lang,
      };
    } else {
      extendedStats.field = this._fieldName;
    }
    return {
      [this._fieldName]: {
        extended_stats: extendedStats,
      },
    };
  }

  async getCategoricalFieldMetaRequest() {
    const field = await this._getField();
    const topTerms = {
      size: COLOR_PALETTE_MAX_SIZE - 1, //need additional color for the "other"-value
    };
    if (field.scripted) {
      topTerms.script = {
        source: field.script,
        lang: field.lang,
      };
    } else {
      topTerms.field = this._fieldName;
    }
    return {
      [this._fieldName]: {
        terms: topTerms,
      },
    };
  }
}
