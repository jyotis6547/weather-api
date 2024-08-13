import { Component, OnInit, ViewChild, Input, ElementRef } from "@angular/core";
import { ApiService } from "src/app/service/api.service";
import { environment } from "src/environments/environment";
import { FormGroup, FormControl, Validators, FormGroupDirective } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { NotificationService } from "src/app/service/notification.service";
import { ConfirmationDialogComponent } from "src/app/confirmation-dialog/confirmation-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { language } from "src/environments/language";
import { Router } from '@angular/router';
import { ConsoleService } from "src/app/service/console.service";
import { MatTableModule } from "@angular/material/table";

import { of } from 'rxjs';

declare function closeModal(selector):any;
declare function openModal(selector):any;
declare function triggerClick(selector):any;
declare var moment:any;

@Component({
  selector: 'app-user-group',
  templateUrl: './user-group.component.html',
  styleUrls: ['./user-group.component.scss']
})
export class UserGroupComponent implements OnInit {


  displayedColumns: string[] = [
    "name",
    "code",
    "status",
    "view",
    "edit",
    "delete",

  ];
  dataSource: MatTableDataSource<any>;

  country: any;
  public crudName = "Add";
  public countryList = [];
  // public depList = [];
  filterValue:any;
  isReadonly=false;
  moduleAccess:any;
  ErrorMsg:any;
  error_msg=false;
  showError=false;

  // public permission={
  //   add:false,
  //   edit:false,
  //   view:true,
  //   delete:false,
  // };

  public permission={
    add:true,
    edit:true,
    view:true,
    delete:true,
  };

  @ViewChild(MatPaginator) pagination: MatPaginator;
  @ViewChild("closebutton") closebutton;
  @ViewChild(FormGroupDirective) formGroupDirective: FormGroupDirective;

  constructor(public api: ApiService, private notification : NotificationService,
    private dialog:MatDialog, private router : Router, private elementref : ElementRef,private logger:ConsoleService) {
    this.getDepartment();
  }

  public editForm = new FormGroup({
    id: new FormControl(""),
    name: new FormControl("", [
      Validators.required,
    ]),
    description: new FormControl(""),
    code: new FormControl("", [Validators.required]),
    created_by: new FormControl(""),
    created_ip: new FormControl(""),
    modified_by: new FormControl(""),
    sequence : new FormControl("", [Validators.pattern("^[0-9]*$")]),
    status: new FormControl(""),
  });
    status = this.editForm.value.status;
   
  populate(data) {
    
    this.editForm.patchValue(data);
    this.editForm.patchValue({modified_by:this.api.userid.user_id});

  }

  initForm() {
    this.editForm.patchValue({
      status: "1",
    });
  }

  Error = (controlName: string, errorName: string) => {
    return this.editForm.controls[controlName].hasError(errorName);
  };

  ngOnInit(): void {

    this.getAccess();
  }

  getDepartment() {
    this.api
      .getAPI(environment.API_URL + "master/department")
      .subscribe((res) => {
        this.dataSource = new MatTableDataSource(res.data);

        this.countryList = res.data;
        this.dataSource.paginator = this.pagination;
      });
  }

  create() {
    this.crudName = "Add";
    this.isReadonly=false;
    this.editForm.enable();
    let reset = this.formGroupDirective.resetForm();
    if(reset!==null) {
      this.initForm();
    }
    var element = <HTMLInputElement>document.getElementById("exampleCheck1");
    element.checked = true;
    openModal('#crud-countries');
  }

  editOption(country) {
    this.isReadonly=false;
    this.editForm.enable();
    this.crudName = "Edit";
    this.populate(country);
    var element = <HTMLInputElement> document.getElementById("exampleCheck1");
    if(this.editForm.value.status == "1") {
     element.checked = true;
    }
    else {
     element.checked = false;
    }
    openModal('#crud-countries');


  }

  onView(country) {
    this.crudName = 'View';
    this.isReadonly=true;
    this.editForm.disable();
    this.populate(country);
    var element = <HTMLInputElement> document.getElementById("exampleCheck1");
    if(this.editForm.value.status == "1") {
     element.checked = true;
    }
    else {
     element.checked = false;
    }
    openModal('#crud-countries');
  }

  onDelete(id) {
    let dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: language[environment.DEFAULT_LANG].confirmMessage
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.api.postAPI(environment.API_URL + "master/department/crud", {
          id: id,
          status: 3,
        }).subscribe((res)=>{
          if(res.status==environment.SUCCESS_CODE) {
            this.notification.warn('User Group'+language[environment.DEFAULT_LANG].deleteMsg);
            this.getDepartment();
          } else {
            this.notification.displayMessage(language[environment.DEFAULT_LANG].unableDelete);
          }
        });
      }
      dialogRef=null;
    });
  }

  onSubmit() {
    this.showError=true;
     if (this.editForm.valid) {
      this.editForm.value.created_by = this.api.userid.user_id;
      // this.editForm.value.status = this.editForm.value.status=="true" ? "1" : "2";
      if(this.editForm.value.status){
        if(this.editForm.value.status=="1")
          this.editForm.value.status="1"          
      }
      else{
        this.editForm.value.status="2"
      }
      this.api
        .postAPI(
          environment.API_URL + "master/department/crud",

          this.editForm.value
        )
        .subscribe((res) => {
          //this.error= res.status;
          if(res.status==environment.SUCCESS_CODE){
            this.notification.success(res.message);
            this.getDepartment();
            this.closebutton.nativeElement.click();
            this.showError=false;
          } else if(res.status==environment.ERROR_CODE) {
            this.error_msg=false;
            this.ErrorMsg=res.message;
            setTimeout(()=> {
              this.error_msg = true;
           }, 2000);
          } else {
            this.notification.displayMessage(language[environment.DEFAULT_LANG].unableSubmit);
          }

        });
    }
    //closeModal('#crud-countries');
  }



  getAccess() {
    this.moduleAccess=this.api.getPageAction();
    if(this.moduleAccess)
    {
      let addPermission=(this.moduleAccess).filter(function(access){ if(access.code=='ADD') return access.status; }).map(function(obj) {return obj.status;});
      let editPermission=(this.moduleAccess).filter(function(access){ if(access.code=='EDIT') { return access.status;} }).map(function(obj) {return obj.status;});;
      let viewPermission=(this.moduleAccess).filter(function(access){ if(access.code=='VIW') { return access.status;} }).map(function(obj) {return obj.status;});;
      let deletePermission=(this.moduleAccess).filter(function(access){ if(access.code=='DEL') { return access.status;} }).map(function(obj) {return obj.status;});;
      this.permission.add=addPermission.length>0?addPermission[0]:false;
      this.permission.edit=editPermission.length>0?editPermission[0]:false;;
      this.permission.view=viewPermission.length>0?viewPermission[0]:false;;
      this.permission.delete=deletePermission.length>0?deletePermission[0]:false;;
    }

  }

  applyFilter(event: Event) {
    this.filterValue = (event.target as HTMLInputElement).value;
    if(this.filterValue){
      this.dataSource.filter = this.filterValue.trim().toLowerCase();
    } else {
      this.getDepartment();
    }
  }
  cancelmodal(){
    this.showError=false;
	  closeModal('#crud-countries');
  }


}
