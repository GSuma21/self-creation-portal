import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appArrayContainsAll]',
  standalone:true
})
export class ArrayContainsAllDirective {
  @Input() set appArrayContainsAll({ mainArray, checkArray }: { mainArray: any[]; checkArray: any[] }) {
    if (checkArray == undefined || (this.containsAll(mainArray, checkArray) && checkArray.length > 0)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  private containsAll(mainArray: any[], checkArray: any[]): boolean {
    return checkArray.every(checkItem =>
      mainArray.some(mainItem => {
        // Customize this comparison based on your object structure and equality check
        return JSON.stringify(checkItem) === JSON.stringify(mainItem); // Example: comparing based on 'id'
      })
    );
  }
}
