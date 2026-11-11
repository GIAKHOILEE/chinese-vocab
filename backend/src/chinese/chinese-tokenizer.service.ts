import { Injectable } from '@nestjs/common';

@Injectable()
export class ChineseTokenizerService {
  /**
   * Tách câu tiếng Trung thành danh sách các từ (tokens) dựa trên thuật toán Maximum Matching (MaxMatch).
   * Các chữ Hán không thuộc dictionary nếu đứng cạnh nhau sẽ được gộp thành token từ ghép ngoài từ điển.
   *
   * @param sentence Câu tiếng Trung cần phân tích
   * @param dictionary Tập hợp các từ tiếng Trung hợp lệ (Known Vocabulary + Basic Words)
   * @returns Danh sách các token tách được
   */
  tokenize(sentence: string, dictionary: Set<string>): string[] {
    if (!sentence) return [];

    // Lọc bỏ dấu câu tiếng Trung và tiếng Anh cơ bản để phân tích từ vựng chính xác
    const cleanSentence = sentence.replace(/[，。！？；：、“”（）\s.,!?:;""'']/g, '');

    // Tìm chiều dài từ lớn nhất trong dictionary để tối ưu MaxMatch
    let maxLength = 1;
    for (const word of dictionary) {
      if (word.length > maxLength) {
        maxLength = word.length;
      }
    }

    const tokens: string[] = [];
    let index = 0;
    const len = cleanSentence.length;

    while (index < len) {
      let matchedWord = '';

      // Thử khớp đoạn văn bản dài nhất có thể từ maxLength giảm dần xuống 1 có trong dictionary
      const currentMax = Math.min(maxLength, len - index);

      for (let subLen = currentMax; subLen >= 1; subLen--) {
        const subStr = cleanSentence.slice(index, index + subLen);
        if (dictionary.has(subStr)) {
          matchedWord = subStr;
          break;
        }
      }

      if (matchedWord) {
        tokens.push(matchedWord);
        index += matchedWord.length;
      } else {
        // Nếu không khớp từ điển, thu thập chuỗi các chữ Hán ngoài từ điển liên tiếp
        let unkStr = cleanSentence[index];
        index++;

        while (index < len) {
          // Kiểm tra xem chữ tiếp theo có bắt đầu một từ hợp lệ trong dictionary hay không
          let isNextMatched = false;
          const nextMax = Math.min(maxLength, len - index);
          for (let subLen = nextMax; subLen >= 1; subLen--) {
            const subStr = cleanSentence.slice(index, index + subLen);
            if (dictionary.has(subStr)) {
              isNextMatched = true;
              break;
            }
          }

          if (isNextMatched) {
            break;
          }

          unkStr += cleanSentence[index];
          index++;
        }

        tokens.push(unkStr);
      }
    }

    return tokens;
  }
}
